var should = require("should");
var Domain = require("..");
var domain;
describe("Domain",function(){
    
    it("#new",function(){
        domain = new Domain();
    })
    
    it("#register",function(){
    
        // define aggre class
        function user_wrap(repos,services,publish){
        
            function User(name){
                this._name = name;
            }
            
            User.prototype = {
                getName:function(){
                   return this._name;
                },
                changeName:function(name){
                    this._name = name;
                    publish("user."+this.id+".changeName",this.id,name);
                    publish("user.*.changeName",this.id,name);
                }
            }
            User.className = "User";
            return User;
        }
        
        
        // define aggre repository
        function user_repo_wrap(Repository,Aggres){
        
            var User = Aggres.User;
            var repository = new Repository("User");
        
            repository._create = function(data,callback){
                var user = new User(data.name);
                callback(undefined,user);
            }
            
            repository._data2aggre = function(data){
                var user = new User(data.name);
                user.id = data.id;
                return user;
            }
            
            repository._aggre2data = function(aggre){
                var data = {
                    name:aggre.getName(),
                    id:aggre.id
                }
                return data;
            }
            
            return repository;
            
        }
        
        
        // define command handle 1
        function ch_wrap1(repos,services){
            function handle(args,callback){
                var repo = repos.user;
                repo.get(args.id,function(err,user){
                    user.changeName(args.name);
                    callback();
                })
            }
            handle.commandName = "change user name";
            return handle;
        }
        
        // define command handle 2
        function ch_wrap2(repos,services){
            function handle(args,callback){
                var repo = repos.User;
                repo.create({name:args.name},callback)
            }
            handle.commandName = "create a user";
            return handle;
        }
        
        // define a listener
        function lis_wrap(repos,services){
            
            function handle(id,data){
                repos.User.getData(data.id,function(d){
                   console.log( services.testservice(2,3,6) );
                });
            }
            
            handle.eventName = "User.*.create";
            
            function handle2(id,data){
                console.log(data)
            }
            
            handle2.eventName = "user.*.changeName";
            
            return [handle,handle2];
        }
        
        // define a service
        function ser_wrap(repos,services){
        
            function service(a,b,c){
               
                return a+b+c;
            }
            
            service.serviceName = "testservice";
            
            return service;
            
        }
        
        domain.register(
                "AggreClass",user_wrap,
                "repository",user_repo_wrap,
                "commandHandle",[ch_wrap2,ch_wrap1],
                "listener",lis_wrap,
                "service",ser_wrap)
              .seal();
        
    })
    it("#register",function(){
    
        domain.exec("create a user",{name:"leo"},function(err,data){
            domain.call("User.changeName",data.id,["brighthas"])
        })
        
    })
})