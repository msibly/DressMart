const MongoClient= require('mongodb').MongoClient
const state={
    db:null
}

module.exports.connect=function(done){
    const url='mongodb+srv://sibly26462:q3ttvYcVEpp70v1K@cluster0.4bfqwq7.mongodb.net/?retryWrites=true&w=majority'; 
    const dbname='DressMart';
    MongoClient.connect(url,function (err,data){
        if(err) return done(err);
        state.db=data.db(dbname);
        done();
    })
}
module.exports.get=function(){
    return state.db
}
